import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'

function RhinoModel({ fileUrl, layerVisibility, onLayersReady }) {
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
  return <primitive object={object} />
}

export function ViewerPage() {
  const [fileUrl, setFileUrl] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [layers, setLayers] = useState([])

  const handleFiles = useCallback((files) => {
    const file = files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.3dm')) {
      setError('Por favor selecciona un archivo .3dm de Rhino.')
      return
    }

    setError('')
    setFileName(file.name)

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

  return (
    <div className="viewer-layout">
      <button
        type="button"
        className="dropzone-toggle"
        onClick={() => setPanelOpen((open) => !open)}
      >
        {panelOpen ? 'Ocultar panel de carga' : 'Mostrar panel de carga'}
      </button>

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
            <p className="dropzone__filename">Cargando: {fileName}</p>
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

      <section className="viewer-canvas-wrapper">
        <Canvas
          camera={{ position: [3, 3, 4], fov: 45 }}
          className="viewer-canvas"
        >
          <color attach="background" args={['#111827']} />
          <ambientLight intensity={0.5} />
          <directionalLight
            intensity={1}
            position={[5, 10, 5]}
            castShadow
          />
          <Environment preset="city" />
          {fileUrl ? (
            <RhinoModel
              fileUrl={fileUrl}
              layerVisibility={layerVisibilityMap}
              onLayersReady={setLayers}
            />
          ) : (
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#4F46E5" />
            </mesh>
          )}
          <OrbitControls
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
    </div>
  )
}

