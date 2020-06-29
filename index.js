"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = exports.Mysql = void 0;
const mysql = __importStar(require("promise-mysql"));
const version = "0.1";
exports.version = version;
//what the fuck is a bluebird
class Mysql {
    constructor(options = {}) {
        this.options = options;
        this.db = mysql.createConnection(options);
    }
    async create_table(table_name, table_data) {
        var _a, _b, _c;
        let statement = `CREATE TABLE IF NOT EXISTS ${this.options.database}.${table_name}`;
        for (let i = 0; i < table_data.length; i++) {
            if (i === table_data.length - 1) {
                statement += ` ${table_data[i].name} ${(_a = table_data[i].type) !== null && _a !== void 0 ? _a : "varchar(120)"})`;
            }
            else if (i === 0) {
                statement += ` (${table_data[i].name} ${(_b = table_data[i].type) !== null && _b !== void 0 ? _b : "varchar(120)"},`;
            }
            else {
                statement += ` ${table_data[i].name} ${(_c = table_data[i].type) !== null && _c !== void 0 ? _c : "varchar(120)"},`;
            }
            ;
        }
        (await this.db).query(statement);
    }
    async insert(table, data) {
        let values = { columns: [], data: [] };
        let query = `INSERT INTO ${this.options.database}.${table}`;
        for (let d of data) {
            if (values.columns.includes(d.column))
                throw new Error(`Column '${d.column}' specified twice.`);
            values.columns.push(d.column);
            values.data.push(d.data);
        }
        query += ` (${values.columns.map((c) => c).join(', ')})`;
        // add escaped values
        query += ` VALUES (${values.data.map(() => '?').join(', ')})`;
        // format the query
        query = (await this.db).format(query, values.data);
        return (await this.db).query(query);
    }
    async fetch(table, filter) {
        var _a;
        let values = { columns: [], data: [], filter: [] };
        let query = `SELECT * FROM ${this.options.database}.${table} WHERE `;
        for (let d of filter) {
            if (values.columns.includes(d.column))
                throw new Error(`Column '${d.column}' specified twice.`);
            values.columns.push(d.column);
            values.data.push(d.data);
            values.filter.push((_a = d.filter_type) !== null && _a !== void 0 ? _a : "AND");
        }
        let index = 0;
        for (let v of values.columns) {
            query += `${v} = ? ${index === values.columns.length - 1 ? "" : values.filter[index]} `;
            index++;
        }
        query = (await this.db).format(query, values.data);
        return (await this.db).query(query);
    }
    async delete(table, filter) {
        var _a;
        let values = { columns: [], data: [], filter: [] };
        let query = `DELETE FROM ${this.options.database}.${table} WHERE `;
        for (let d of filter) {
            if (values.columns.includes(d.column))
                throw new Error(`Column '${d.column}' specified twice.`);
            values.columns.push(d.column);
            values.data.push(d.data);
            values.filter.push((_a = d.filter_type) !== null && _a !== void 0 ? _a : "AND");
        }
        let index = 0;
        for (let v of values.columns) {
            query += `${v} = ? ${index === values.columns.length - 1 ? "" : values.filter[index]} `;
            index++;
        }
        query = (await this.db).format(query, values.data);
        return (await this.db).query(query);
    }
}
exports.Mysql = Mysql;
;
