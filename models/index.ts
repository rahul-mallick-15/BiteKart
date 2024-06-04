import {Sequelize} from "sequelize";
require('dotenv').config();

const url = process.env.DB_URL ;
if(!url){
    throw new Error("DB_URL is not defined");
}

const sequelize = new Sequelize(url, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
          require: false,
        },
    },
});

export default sequelize;