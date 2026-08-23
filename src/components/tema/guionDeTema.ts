/**
 * Se ejecuta antes del primer pintado para que la página no aparezca en claro
 * y salte a oscuro un instante después. Sin preferencia guardada no toca nada
 * y manda el sistema operativo (`prefers-color-scheme` en globals.css).
 */
export const CLAVE_DE_TEMA = "pentcord-tema";

export const GUION_DE_TEMA = `(function(){try{var t=localStorage.getItem("${CLAVE_DE_TEMA}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;
