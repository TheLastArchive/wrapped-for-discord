require("dotenv").config();
const { Sequelize, DataTypes, UUIDV4 } = require("sequelize");

// const database = process.env.DATABASE;
const database = process.env.DATABASE_TEST;
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;

let sequelize = null;

async function defineAndAssociateAll() {
    console.log("Defining data models...");
    const User = defineUser();
    const Token = defineToken();
    const Artist = defineArtist();
    const Album = defineAlbum();
    const Track = defineTrack();
    const History = defineHistory();
    console.log("All data models defined");

    console.log("Creating associations...");
    createAssociation(User, Token, "user_id");
    createAssociation(Album, Track, "album_id");
    createAssociation(Artist, Album, "artist_id");
    createAssociation(Artist, Track, "artist_id");
    createAssociation(User, History, "user_id");
    createAssociation(Track, History, "track_id")
    createAssociation(Album, History, "album_id")
    createAssociation(Artist, History, "artist_id")

    console.log("Associations created");

    // await sequelize.sync({ alter: true });
    // await sequelize.sync({ force: true });
}

function createAssociation(parent, child, foreignKey) {
    parent.hasOne(child, { foreignKey });
    child.belongsTo(parent, { foreignKey });
}

function defineUser() {
    const User = sequelize.define(
        "User",
        {
            user_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: UUIDV4,
                allowNull: false,
                unique: true,
            },
            spotify_id: {
                //Needs to be a STRING (VARCHAR(255))
                //MySQL won't let you have UNIQUE columns of type TEXT
                //due to the unfixed length.
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            display_name: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            spotify_url: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            profile_image_url: {
                type: DataTypes.TEXT,
            },
            played_at: {
                type: DataTypes.BIGINT,
            },
            // discord_id: {
            //     type: DataTypes.STRING,
            //     allowNull: false,
            //     unique: true
            // }
        },
        {
            tableName: "users",
            timestamps: false,
        }
    );

    return User;
}

function defineToken() {
    const Token = sequelize.define(
        "Token",
        {
            token_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: UUIDV4,
                allowNull: false,
                unique: true,
            },
            access_token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            refresh_token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            token_expires_epoch: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            iv: {
                type: DataTypes.BLOB,
                allowNull: false,
            },
            // foreignKey for User data model
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
            },
        },
        {
            tableName: "tokens",
            timestamps: false,
        }
    );

    return Token;
}

function defineTrack() {
    const Track = sequelize.define(
        "Track",
        {
            track_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: UUIDV4,                
                allowNull: false,
                unique: true,
            },
            spotify_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            spotify_url: {
                type: DataTypes.TEXT,
            },
            duration_ms: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            // foreignKey for Artist data model
            artist_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: false,
            },
            // foreignKey for Album data model
            album_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: false,
            },
        },
        {
            tableName: "tracks",
            timestamps: false,
        }
    );

    return Track;
}

function defineArtist() {
    const Artist = sequelize.define(
        "Artist",
        {
            artist_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: UUIDV4,
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            spotify_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            spotify_url: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        },
        {
            tableName: "artists",
            timestamps: false,
        }
    );

    return Artist;
}

function defineAlbum() {
    const Album = sequelize.define(
        "Album",
        {
            album_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: UUIDV4,
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            spotify_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            spotify_url: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            // foreignKey for Artist data model
            artist_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: false,
            },
            album_image_url: {
                type: DataTypes.TEXT,
            },
        },
        {
            tableName: "albums",
            timestamps: false,
        }
    );

    return Album;
}

function defineHistory() {
    const History = sequelize.define(
        "History",
        {
            history_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: UUIDV4,
                allowNull: false,
                unique: true,
            },
            // foreignKey for User data model
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: false,
            },
            // foreign key for Track data model
            track_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: false,
            },
            // foreignKey for Album data model
            album_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: false,
            },
            // foreignKey for Artist data model
            artist_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: false,
            },
            played_at: {
                type: DataTypes.BIGINT,
                allowNull: false,
                unique: true
            },
        },
        {
            tableName: "history",
            timestamps: false,
        }
    );

    return History;
}

async function getDBConnection() {
    if (sequelize) {
        return sequelize;
    }

    sequelize = new Sequelize(database, db_username, db_password, {
        dialect: "mysql",
        logging: false,
        define: {
            freezeTableName: true,
        },
    });

    let connection = true;
    //Test the connection
    await sequelize
        .authenticate()
        .then(() => console.log("Connected to " + database))
        .catch((err) => {
            console.error("Error connecting to the database", err);
            connection = false;
        });
    if (connection) {
        await defineAndAssociateAll();
        return sequelize;
    }
    return null;
}

// getDBConnection()
module.exports = {
    getDBConnection,
};
