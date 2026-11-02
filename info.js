export function inf(key){
    let t = {
        'kab': 24,
        'obspass': process.env.LEGACY_OBSPASS,
        'login': process.env.LEGACY_LOGIN,
        'pass': process.env.LEGACY_PASS,
        'group_id': process.env.LEGACY_GROUP_ID
    }
    return t[key]
}
