<script setup>
import Icono from '@/components/Icono.vue'

/**
 * Explica, en palabras simples, que datos guarda Sintaxia y cuales se muestran
 * a otras personas. Aparece donde se pide un dato (ingresar, crear cuenta) y en
 * el perfil. Es un <details>: cerrado ocupa una linea, abierto lo cuenta todo.
 */
defineProps({
  abierto: { type: Boolean, default: false }
})
</script>

<template>
  <details class="datos" :open="abierto">
    <summary class="datos__resumen">
      <Icono nombre="escudo" :tamano="18" :trazo="2.1" />
      Que datos guardamos y cuales se ven
    </summary>

    <div class="datos__cuerpo">
      <section>
        <h3>Lo que guardamos (solo lo ves vos)</h3>
        <ul>
          <li>
            <strong>Tu correo y tu contrasena</strong>, si creas una cuenta. Los guarda el servicio de
            autenticacion; la contrasena queda cifrada y nosotros nunca la vemos.
          </li>
          <li><strong>Tu alias</strong>, tu avatar y tu meta diaria.</li>
          <li>
            <strong>Tu historial:</strong> que lecciones terminaste, cuantas actividades acertaste y
            cuando.
          </li>
          <li>Si entras como <strong>invitado</strong>: solo un identificador anonimo, sin correo.</li>
        </ul>
      </section>

      <section>
        <h3>Lo que se muestra a otras personas</h3>
        <p>
          <strong>Hoy, nada.</strong> Cuando se active el ranking se va a mostrar unicamente tu
          <strong>alias con un codigo</strong> (por ejemplo <code>Ana#0427</code>) y tu XP de la semana,
          y solo si tenes una cuenta. Los invitados no aparecen. Tu correo y tu historial nunca se
          muestran.
        </p>
      </section>

      <section>
        <h3>Sobre ser invitado</h3>
        <p>
          Si cerras sesion, borras los datos del navegador o cambias de dispositivo, <strong>perdes el
          acceso a tu historial de invitado</strong>. Creando una cuenta lo conservas.
        </p>
      </section>
    </div>
  </details>
</template>

<style scoped>
.datos {
  width: 100%;
  text-align: left;
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  background: var(--c-fondo);
}

.datos__resumen {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  list-style: none;
  padding: 0.7rem 0.9rem;
  font-size: var(--t-sm);
  font-weight: 800;
  color: var(--c-violeta-osc);
}

.datos__resumen::-webkit-details-marker {
  display: none;
}

.datos__resumen:focus-visible {
  outline: 3px solid var(--c-azul);
  outline-offset: 2px;
  border-radius: var(--r-md);
}

.datos__cuerpo {
  display: grid;
  gap: var(--e-3);
  padding: 0 0.9rem 0.9rem;
  font-size: var(--t-sm);
}

.datos__cuerpo h3 {
  font-size: var(--t-sm);
  margin-bottom: 0.3rem;
}

.datos__cuerpo ul {
  display: grid;
  gap: 0.35rem;
  padding-left: 1.1rem;
  list-style: disc;
}

.datos__cuerpo code {
  font-family: var(--f-codigo);
  background: var(--c-blanco);
  padding: 0 0.3rem;
  border-radius: 4px;
}
</style>
