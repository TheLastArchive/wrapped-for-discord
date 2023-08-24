require('dotenv').config();
const { Sequelize, DataTypes, UUIDV4 } = require('sequelize');

const database = process.env.DATABASE;
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;

let sequelize = null;

async function define_all(sequelize) {
    console.log("Defining data models...")
    const User = define_user(sequelize);
    const Token = define_token(sequelize);
    User.hasOne(Token, { foreignKey: 'user_id'});
    Token.belongsTo(User, { foreignKey: 'user_id' });
    console.log("All data models defined")
    await sequelize.sync({ alter: true })
}


function define_user(sequelize) {
    const User = sequelize.define('User', {
        user_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: UUIDV4
        },
        spotify_id: {
            //Needs to be a STRING
            //MySQL won't let you have UNIQUE columns of type TEXT for some reason.
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        display_name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        spotify_url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        profile_image_url: {
            type: DataTypes.TEXT,
        }
    }, {
        tableName: 'users',
        timestamps: false
    });

    console.log("User data model defined")
    return User;
}


function define_token(sequelize) {
    const Token = sequelize.define('Token', {
        token_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: UUIDV4
        },
        access_token: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        refresh_token: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        token_expires_epoch: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        salt: {
            type: DataTypes.TEXT
            // allowNull: false
        }
    }, {
        tableName: 'tokens',
        timestamps: false
    });

    console.log("Token data model defined")
    return Token;
}


async function get_db_connection() {

    if (sequelize) {
        return sequelize;
    }

    sequelize = new Sequelize(database, db_username, db_password, {
        dialect: 'mysql',
        define: {
            freezeTableName: true
        }
    });

    let connection = true;
    //Test the connection
    await sequelize.authenticate()
    .then(() => console.log("Connected to " + database))
    .catch((err) => {
        console.error("Error connecting to the database", err)
        connection = false
    })
    if (connection) {
        await define_all(sequelize);
        return sequelize;
    }
    return null;
}

module.exports = {
    get_db_connection
}