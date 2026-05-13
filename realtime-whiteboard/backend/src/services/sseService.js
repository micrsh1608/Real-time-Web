// Map: roomId -> Set of response objects
const sseClients = new Map();

function addSSEClient(roomId, res) {
  if (!sseClients.has(roomId)) sseClients.set(roomId, new Set());
  sseClients.get(roomId).add(res);
}

function removeSSEClient(roomId, res) {
  if (sseClients.has(roomId)) {
    sseClients.get(roomId).delete(res);
  }
}

function broadcastSSE(roomId, event, data) {
  if (!sseClients.has(roomId)) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.get(roomId).forEach(res => {
    try { res.write(payload); } catch (e) { /* client disconnected */ }
  });
}

module.exports = { sseClients, addSSEClient, removeSSEClient, broadcastSSE };
