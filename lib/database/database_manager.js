require('dotenv').config();
const { Sequelize, DataTypes, UUIDV4 } = require('sequelize');

const database = process.env.DATABASE;
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;

let sequelize = null;

async function define_and_associate_all() {
    console.log("Defining data models...");
    const User = define_user();
    const Token = define_token();
    const Track = define_track();
    const Album = define_album();
    const Artist = define_artist();
    const History = define_history();
    console.log("All data models defined");

    console.log("Creating associations...");
    create_association(User, Token, 'user_id');
    create_association(Album, Track, 'album_id');
    create_association(Artist, Album, 'artist_id');
    create_association(Artist, Track, 'artist_id');
    create_association(User, History, 'user_id');
    create_association(Track, History, 'track_id');
    console.log("Associations created");

    await sequelize.sync({ alter: true })
}


function create_association(model_1, model_2, foreignKey) {
    model_1.hasOne(model_2, { foreignKey });
    model_2.belongsTo(model_1, { foreignKey });
}


function define_user() {
    const User = sequelize.define('User', {
        user_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: UUIDV4
        },
        spotify_id: {
            //Needs to be a STRING (VARCHAR(255))
            //MySQL won't let you have UNIQUE columns of type TEXT due to the unfixed length.
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

    return User;
}


function define_token() {
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
        },
        // foreignKey for User data model
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        }
    }, {
        tableName: 'tokens',
        timestamps: false
    });

    return Token;
}


function define_track() {
    const Track = sequelize.define('Track', {
        track_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: UUIDV4
        },
        spotify_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        spotify_url: {
            type: DataTypes.TEXT
        },
        duration_ms: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        // foreignKey for Arist data model
        artist_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        },
        //foreignKey for Album data model
        album_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        }
    }, {
        tableName: 'tracks',
        timestamps: false
    });

    return Track;
}


function define_artist() {
    const Artist = sequelize.define('Artist', {
        artist_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: UUIDV4
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        spotify_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        spotify_url: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'artists',
        timestamps: false
    });

    return Artist
}


function define_album() {
    const Album = sequelize.define('Album', {
        album_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: UUIDV4
        }, 
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        spotify_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        spotify_url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        // foreignKey for Arist data model
        artist_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        },
        album_image_url: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'albums',
        timestamps: false
    });

    return Album;
}


function define_history() {
    const History = sequelize.define('History', {
        history_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: UUIDV4
        },
        //foreignKey for User data model
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        }, 
        // foreignKey for Track data model
        track_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        },
        played_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'history',
        timestamps: false
    });

    return History;
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
        await define_and_associate_all();
        return sequelize;
    }
    return null;
}

// get_db_connection()
module.exports = {
    get_db_connection
}
