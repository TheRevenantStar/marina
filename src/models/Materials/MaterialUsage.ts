/**
 * Material Usage Logs
 *
 * Used to estimate material use by logging removals of material length
 */

import {
  type Association,
  DataTypes,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type NonAttribute,
  Sequelize
} from 'sequelize';

import Material from './Material';

export default class MaterialUsage extends Model<
  InferAttributes<MaterialUsage>,
  InferCreationAttributes<MaterialUsage>
> {
  /**
   * The ID of the material usage log
   * (Optional, auto-generated by database at INSERT)
   */
  declare materialUsageId: CreationOptional<number>;

  /**
   * The ID of the material (spool)
   */
  declare materialId: ForeignKey<Material['materialId']>;

  /**
   * The amount of material used (in grams)
   */
  declare weightUsed: number;

  // Timestamps
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  public static initialize(sequelize: Sequelize) {
    return this.init(
      {
        materialUsageId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        materialId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Material',
            key: 'materialId'
          }
        },
        weightUsed: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'MaterialUsage',
        tableName: 'material_usage'
      }
    );
  }

  // Associations
  declare material: NonAttribute<Material>;

  static associations: {
    material: Association<MaterialUsage, Material>;
  };

  public static associate() {
    // Belongs to Material
    MaterialUsage.belongsTo(Material, {
      foreignKey: 'materialId',
      targetKey: 'materialId',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      as: 'material'
    });
  }
}
