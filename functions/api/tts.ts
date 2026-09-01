export async function onRequestPost() {
  return new Response(
    JSON.stringify({ supported: true, message: "Browser speech synthesis enabled." }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    }
  );
}
