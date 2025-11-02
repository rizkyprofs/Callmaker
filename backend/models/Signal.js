// models/Signal.js - COMPLETE FIX
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Signal = sequelize.define("Signal", {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  coin_name: { 
    type: DataTypes.STRING(50), 
    allowNull: false 
  },
  entry_price: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
  target_price: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
  stop_loss: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
  note: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  chart_image: { 
    type: DataTypes.STRING(255), 
    allowNull: true 
  },
  status: { 
    type: DataTypes.ENUM("pending", "approved", "rejected"), 
    defaultValue: "pending" 
  },
  created_by: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  }
}, {
  tableName: 'signals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Signal;