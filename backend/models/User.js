import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // ⚠️ karena default export, gak pakai {}

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM("admin", "callmaker", "user"), defaultValue: "user" },
  fullname: { type: DataTypes.STRING(100), allowNull: true },
});

export default User;
