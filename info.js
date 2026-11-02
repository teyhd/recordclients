export var tinfo = {
    'kab': 7,
    'obspass': process.env.LEGACY_OBSPASS,
}
export function inf(key){
    return tinfo[key]
}
