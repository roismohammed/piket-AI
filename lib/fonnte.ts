export async function sendFonnte({
  token,
  target,
  message,
}: {
  token: string;
  target: string;
  message: string;
}) {
  const fd = new FormData();
  fd.append("target", target);
  fd.append("message", message);

  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token },
    body: fd,
  });

  const body = await res.json().catch(() => null);

  return {
    ok: res.ok && body?.status === true,
    status: res.status,
    body,
    error: body?.reason,
  };
}
