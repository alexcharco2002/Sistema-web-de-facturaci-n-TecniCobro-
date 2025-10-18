export async function obtenerUsuarios() {
  const res = await fetch("http://localhost/facturacion-agua/backend/index.php?route=usuarios");
  const data = await res.json();
  return data;
}
