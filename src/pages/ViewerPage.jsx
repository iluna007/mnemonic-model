import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import { useAuth } from '../contexts/AuthContext'
import {
  getModelById,
  getModelFileSignedUrl,
  uploadModel,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
} from '../lib/modelsApi'
import {
  getCommentsByModelId,
  addComment as addCommentApi,
} from '../lib/commentsApi'

/** Detecta rotación/pan/zoom en el canvas y notifica el modo para cambiar el cursor */
function ViewerCursorController({ onCursorModeChange }) {
  const { gl } = useThree()
  const zoomTimeoutRef = useRef(null)

  useEffect(() => {
    const el = gl.domElement

    const handlePointerDown = (e) => {
      if (e.button === 0) onCursorModeChange('rotate')
      else if (e.button === 2) onCursorModeChange('pan')
    }
    const handlePointerUp = () => onCursorModeChange(null)
    const handlePointerLeave = () => onCursorModeChange(null)
    const handleWheel = () => {
      onCursorModeChange('zoom')
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
      zoomTimeoutRef.current = setTimeout(() => onCursorModeChange(null), 180)
    }

    el.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    el.addEventListener('pointerleave', handlePointerLeave)
    el.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      el.removeEventListener('pointerleave', handlePointerLeave)
      el.removeEventListener('wheel', handleWheel)
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
    }
  }, [gl, onCursorModeChange])

  return null
}

function RhinoModel({
  fileUrl,
  layerVisibility,
  onLayersReady,
  onModelClick,
}) {
  const [object, setObject] = useState(null)
  const layerObjectsRef = useRef({})

  useEffect(() => {
    if (!fileUrl) return

    const loader = new Rhino3dmLoader()
    loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.1/')

    loader.load(
      fileUrl,
      (obj) => {
        const box = new THREE.Box3().setFromObject(obj)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        obj.position.sub(center)

        const maxAxis = Math.max(size.x, size.y, size.z)
        if (maxAxis > 0) {
          obj.scale.multiplyScalar(2 / maxAxis)
        }

        // Ajustar orientación: Rhino usa Z-up, convertimos a Y-up de Three.js
        obj.rotation.x = -Math.PI / 2
        obj.updateMatrixWorld(true)

        // Construir mapa de capas a partir de los metadatos del modelo
        const layersMeta = obj.userData?.layers || []
        layerObjectsRef.current = {}
        const layerInfoMap = {}

        obj.traverse((child) => {
          if (!child.isMesh) return
          const layerIndex = child.userData?.attributes?.layerIndex
          if (typeof layerIndex !== 'number') return

          if (!layerObjectsRef.current[layerIndex]) {
            layerObjectsRef.current[layerIndex] = []
          }
          layerObjectsRef.current[layerIndex].push(child)

          if (!layerInfoMap[layerIndex]) {
            const meta = layersMeta[layerIndex] || {}
            layerInfoMap[layerIndex] = {
              index: layerIndex,
              name:
                meta.name ||
                meta.fullPath ||
                `Capa ${Number(layerIndex) + 1}`,
              visible: meta.visible !== false,
            }
          }
        })

        const layersArray = Object.values(layerInfoMap).sort(
          (a, b) => a.index - b.index,
        )

        if (onLayersReady) {
          onLayersReady(layersArray)
        }

        setObject(obj)
      },
      undefined,
      (error) => {
        console.error('Error al cargar el modelo 3DM', error)
      },
    )

    return () => {
      if (object) {
        object.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
      }
      layerObjectsRef.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl])

  useEffect(() => {
    if (!layerVisibility) return

    Object.entries(layerObjectsRef.current).forEach(([index, meshes]) => {
      const visible =
        layerVisibility[index] !== undefined ? layerVisibility[index] : true
      meshes.forEach((mesh) => {
        // eslint-disable-next-line no-param-reassign
        mesh.visible = visible
      })
    })
  }, [layerVisibility])

  if (!object) return null
  return (
    <primitive
      object={object}
      onPointerDown={
        onModelClick
          ? (e) => {
              e.stopPropagation()
              onModelClick(e.point)
            }
          : undefined
      }
    />
  )
}

/** Marcadores 3D de comentarios en el modelo */
function CommentMarkers({ comments, onSelectComment }) {
  if (!comments?.length) return null
  return (
    <group>
      {comments.map((c) => (
        <mesh
          key={c.id}
          position={[c.position?.x ?? 0, c.position?.y ?? 0, c.position?.z ?? 0]}
          onClick={(e) => {
            e.stopPropagation()
            onSelectComment(c)
          }}
        >
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#b45309" />
        </mesh>
      ))}
    </group>
  )
}

export function ViewerPage() {
  const { modelId: routeModelId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [fileUrl, setFileUrl] = useState(null)
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [modelMeta, setModelMeta] = useState(null)
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [layers, setLayers] = useState([])
  const [cursorMode, setCursorMode] = useState(null)
  const [addingComment, setAddingComment] = useState(false)
  const [commentModal, setCommentModal] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)

  const modelId = routeModelId || null
  const isViewingUploadedModel = !!modelId

  // Al salir de /view/:id, limpiar modelo cargado desde API
  useEffect(() => {
    if (!modelId) {
      setModelMeta(null)
      setComments([])
      if (fileUrl && fileUrl.startsWith('http')) {
        setFileUrl(null)
        setFileName('')
      }
    }
  }, [modelId])

  // Cargar modelo por ID desde Supabase
  useEffect(() => {
    if (!modelId) return
    let cancelled = false
    setError('')
    setFileUrl(null)
    setModelMeta(null)
    getModelById(modelId)
      .then(async (model) => {
        if (cancelled) return
        setModelMeta({ id: model.id, name: model.name })
        setFileName(model.name)
        const url = await getModelFileSignedUrl(model.storage_path)
        if (!cancelled) setFileUrl(url)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Error al cargar el modelo')
      })
    return () => { cancelled = true }
  }, [modelId])

  // Cargar comentarios cuando hay modelo subido
  useEffect(() => {
    if (!modelId) {
      setComments([])
      return
    }
    let cancelled = false
    setCommentsLoading(true)
    getCommentsByModelId(modelId)
      .then((data) => {
        if (!cancelled) setComments(data)
      })
      .catch(() => {
        if (!cancelled) setComments([])
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false)
      })
    return () => { cancelled = true }
  }, [modelId])

  const refreshComments = useCallback(() => {
    if (!modelId) return
    getCommentsByModelId(modelId).then(setComments)
  }, [modelId])

  const handleFiles = useCallback((files) => {
    const file = files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.3dm')) {
      setError('Por favor selecciona un archivo .3dm de Rhino.')
      return
    }

    setError('')
    setFileName(file.name)
    setSelectedFile(file)

    const url = URL.createObjectURL(file)
    setFileUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }, [])

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const files = event.dataTransfer.files
    handleFiles(files)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleInputChange = (event) => {
    const files = event.target.files
    handleFiles(files)
  }

  const toggleLayerVisibility = (layerIndex) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.index === layerIndex
          ? { ...layer, visible: !layer.visible }
          : layer,
      ),
    )
  }

  const layerVisibilityMap = useMemo(
    () =>
      layers.reduce((acc, layer) => {
        acc[layer.index] = layer.visible
        return acc
      }, {}),
    [layers],
  )

  const handlePlaceComment = useCallback((point) => {
    if (!isAuthenticated || !modelId) return
    setCommentModal({
      type: 'add',
      point: { x: point.x, y: point.y, z: point.z },
    })
    setAddingComment(false)
  }, [isAuthenticated, modelId])

  const handleSubmitNewComment = useCallback(
    async (body) => {
      if (!commentModal || commentModal.type !== 'add' || !user || !modelId)
        return
      try {
        await addCommentApi(
          modelId,
          user.id,
          commentModal.point,
          body,
        )
        refreshComments()
        setCommentModal(null)
      } catch (err) {
        setError(err.message || 'Error al guardar el comentario')
      }
    },
    [commentModal, user, modelId, refreshComments],
  )

  const handleViewComment = useCallback((comment) => {
    setCommentModal({ type: 'view', comment })
  }, [])

  const handleUploadModel = useCallback(async () => {
    if (!selectedFile || !user) return
    setUploading(true)
    setError('')
    try {
      const row = await uploadModel(selectedFile, user.id)
      navigate(`/view/${row.id}`, { replace: true })
    } catch (err) {
      const msg = err.message || ''
      if (
        msg.includes('maximum allowed size') ||
        msg.includes('exceeded the maximum')
      ) {
        setError(
          'El archivo supera el límite de 50 MB (plan gratuito de Supabase). Reduce el tamaño del .3dm o comprime la geometría en Rhino.',
        )
      } else {
        setError(msg || 'Error al subir el modelo')
      }
    } finally {
      setUploading(false)
    }
  }, [selectedFile, user, navigate])

  return (
    <div className="viewer-layout">
      <div className="viewer-toolbar">
        <button
          type="button"
          className="dropzone-toggle"
          onClick={() => setPanelOpen((open) => !open)}
        >
          {panelOpen ? 'Ocultar panel de carga' : 'Mostrar panel de carga'}
        </button>
        {!isViewingUploadedModel &&
          isAuthenticated &&
          selectedFile && (
            <button
              type="button"
              className="viewer-toolbar__upload"
              onClick={handleUploadModel}
              disabled={
                uploading ||
                selectedFile.size > MAX_UPLOAD_SIZE_BYTES
              }
              title={
                selectedFile.size > MAX_UPLOAD_SIZE_BYTES
                  ? `Máximo ${MAX_UPLOAD_SIZE_MB} MB`
                  : undefined
              }
            >
              {uploading ? 'Subiendo…' : 'Subir modelo'}
            </button>
          )}
        {isViewingUploadedModel && isAuthenticated && (
          <button
            type="button"
            className={`viewer-toolbar__add-comment ${addingComment ? 'viewer-toolbar__add-comment--active' : ''}`}
            onClick={() => setAddingComment((a) => !a)}
          >
            {addingComment
              ? 'Clic en el modelo para colocar'
              : 'Añadir comentario'}
          </button>
        )}
      </div>

      <section
        className={`dropzone-panel ${
          panelOpen ? 'dropzone-panel--open' : 'dropzone-panel--closed'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="dropzone">
          <p className="dropzone__title">
            Arrastra y suelta tu archivo .3dm aquí
          </p>
          <p className="dropzone__subtitle">o</p>
          <label className="dropzone__button">
            Seleccionar archivo
            <input
              type="file"
              accept=".3dm"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </label>
          {fileName && (
            <>
              <p className="dropzone__filename">
                {fileName}
                {selectedFile && (
                  <span className="dropzone__filesize">
                    {' '}
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                )}
              </p>
              {selectedFile &&
                selectedFile.size > MAX_UPLOAD_SIZE_BYTES &&
                isAuthenticated && (
                  <p className="dropzone__warn">
                    Supera el límite de {MAX_UPLOAD_SIZE_MB} MB para subir.
                    Reduce el archivo en Rhino.
                  </p>
                )}
            </>
          )}
          {error && <p className="dropzone__error">{error}</p>}
        </div>

        {layers.length > 0 && (
          <div className="layers-panel">
            <p className="layers-panel__title">Capas del modelo</p>
            <ul className="layers-list">
              {layers.map((layer) => (
                <li key={layer.index} className="layers-list__item">
                  <label className="layers-list__label">
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => toggleLayerVisibility(layer.index)}
                    />
                    <span className="layers-list__name">
                      {layer.name || `Capa ${layer.index + 1}`}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section
        className="viewer-canvas-wrapper"
        style={{
          cursor:
            cursorMode === 'rotate'
              ? 'var(--cursor-rotate)'
              : cursorMode === 'pan'
                ? 'move'
                : cursorMode === 'zoom'
                  ? 'zoom-in'
                  : 'grab',
        }}
      >
        <Canvas
          camera={{ position: [3, 3, 4], fov: 45 }}
          className="viewer-canvas"
        >
          <ViewerCursorController onCursorModeChange={setCursorMode} />
          <color attach="background" args={['#111827']} />
          <ambientLight intensity={0.5} />
          <directionalLight
            intensity={1}
            position={[5, 10, 5]}
            castShadow
          />
          <Environment preset="city" />
          {fileUrl ? (
            <>
              <RhinoModel
                fileUrl={fileUrl}
                layerVisibility={layerVisibilityMap}
                onLayersReady={setLayers}
                onModelClick={addingComment ? handlePlaceComment : undefined}
              />
              <CommentMarkers
                comments={comments}
                onSelectComment={handleViewComment}
              />
            </>
          ) : (
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#4F46E5" />
            </mesh>
          )}
          <OrbitControls
            enable={!addingComment}
            enableDamping
            dampingFactor={0.1}
            enablePan
            enableZoom
            rotateSpeed={0.8}
            zoomSpeed={0.8}
            panSpeed={0.6}
          />
        </Canvas>
      </section>

      {commentModal && (
        <CommentModal
          mode={commentModal.type}
          point={commentModal.type === 'add' ? commentModal.point : null}
          comment={commentModal.type === 'view' ? commentModal.comment : null}
          onSubmit={handleSubmitNewComment}
          onClose={() => setCommentModal(null)}
        />
      )}
    </div>
  )
}

function CommentModal({ mode, point, comment, onSubmit, onClose }) {
  const [body, setBody] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'add' && body.trim()) {
      onSubmit(body.trim())
      setBody('')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal--comment"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        {mode === 'add' ? (
          <form onSubmit={handleSubmit}>
            <p className="modal__title">Nuevo comentario en el modelo</p>
            <p className="modal__hint">
              Posición: ({point?.x?.toFixed(2)}, {point?.y?.toFixed(2)},{' '}
              {point?.z?.toFixed(2)})
            </p>
            <textarea
              className="modal__textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu comentario…"
              rows={4}
              autoFocus
            />
            <div className="modal__actions">
              <button type="button" className="modal__btn modal__btn--secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="modal__btn modal__btn--primary" disabled={!body.trim()}>
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="modal__title">Comentario</p>
            <p className="modal__body">{comment?.body}</p>
            <p className="modal__meta">
              {comment?.created_at
                ? new Date(comment.created_at).toLocaleString()
                : ''}
            </p>
            <button type="button" className="modal__btn modal__btn--primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

