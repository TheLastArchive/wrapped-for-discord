const db = require("./databaseManager");

let sequelize = null;

async function deleteAllUserData(user_id) {
    if (!user_id) {
        return;
    }
    await checkDBConnection();
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const model in sequelize.models) {
        if (!sequelize.models[model].rawAttributes.hasOwnProperty("user_id")) {
            continue;
        }
        await sequelize.models[model].destroy({
            where: {
                user_id
            }
        });
    }
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

}

async function checkDBConnection() {
    if (!sequelize) {
        sequelize = await db.getDBConnection();
    }
}
