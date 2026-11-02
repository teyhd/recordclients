export var tinfo = {
    kab: Number(process.env.RECORDER_ROOM_ID || 0),
    obspass: process.env.OBS_WEBSOCKET_PASSWORD || '',
};
export function inf(key) { return tinfo[key]; }
