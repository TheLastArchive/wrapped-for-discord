const fs = require('fs');

function loadJSON() {
    return JSON.parse(
        fs.readFileSync('./temp_db.json').toString()
    )
}

function saveJSON(data) {
    return fs.writeFileSync(
        './temp_db.json', JSON.stringify(data))
}

module.exports = {
    loadJSON,
    saveJSON
}