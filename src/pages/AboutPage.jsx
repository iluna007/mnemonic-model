export function AboutPage() {
  return (
    <section className="page page--text">
      <h1>About</h1>
      <p>
        Esta aplicación es un visor ligero de archivos Rhino (.3dm) construido
        con React, Vite y Three.js. Permite cargar modelos localmente mediante
        drag &amp; drop y explorarlos en 3D directamente en el navegador.
      </p>
      <p>
        El motor 3D está basado en Three.js y utiliza el{' '}
        <code>Rhino3dmLoader</code> descrito en la documentación oficial de
        Three.js (
        <a
          href="https://threejs.org/docs/#Rhino3dmLoader"
          target="_blank"
          rel="noreferrer"
        >
          ver documentación
        </a>
        ).
      </p>
    </section>
  )
}

