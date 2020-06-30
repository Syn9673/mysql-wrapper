import * as mysql from "promise-mysql";
import * as Bluebird from "bluebird";

const version: string = "0.1";

interface Options {
  host?: string,
  port?: number,
  user?: string,
  password?: string,
  database?: string
}

interface ColumnData {
  name: string,
  type?: string,
  primary?: boolean
}

interface InsertData {
  column: string,
  data: any
}

interface FilterData extends InsertData {
  filter_type?: string
}

const pool_options = {
  waitForConnections: true,
  connectionLimit: 20
};

//what the fuck is a bluebird
class Mysql {
  public db: Bluebird<mysql.Pool>;
  constructor(public options: Options = {}) {
    this.db = mysql.createPool({ ...pool_options, ...this.options});
  }

  async create_table(table_name: string, table_data: ColumnData[]): Promise<any> {
    let statement = `CREATE TABLE IF NOT EXISTS ${this.options.database}.${table_name}`;
    for (let i = 0; i < table_data.length; i++) {
      if (i === table_data.length - 1) {
        statement += ` ${table_data[i].name} ${table_data[i].type ?? "varchar(120)"} ${table_data[i].primary ? "PRIMARY KEY" : ""})`;
      } else if (i === 0) {
        statement += ` (${table_data[i].name} ${table_data[i].type ?? "varchar(120)"} ${table_data[i].primary ? "PRIMARY KEY" : ""},`;
      } else {
        statement += ` ${table_data[i].name} ${table_data[i].type ?? "varchar(120)"} ${table_data[i].primary ? "PRIMARY KEY" : ""},`;
      };
    }

    let connection: mysql.PoolConnection = await (await this.db).getConnection();
    let result: any = connection.query(statement);
    connection.release();

    return result;
  }

  async insert(table: string, data: InsertData[]): Promise<any> {
    let values: any = { columns: [], data: [] };

    let query: string = `REPLACE INTO ${this.options.database}.${table}`;
    for (let d of data) {
      if (values.columns.includes(d.column))
        throw new Error(`Column '${d.column}' specified twice.`)

      values.columns.push(d.column);
      values.data.push(d.data);
    }

    query += ` (${values.columns.map((c: any) => c).join(', ')})`;

    // add escaped values
    query += ` VALUES (${values.data.map(() => '?').join(', ')})`;

    let connection: mysql.PoolConnection = await (await this.db).getConnection();

    // format the query
    query = connection.format(query, values.data);
    
    let result: any = connection.query(query);
    connection.release();

    return result;
  }

  async fetch(table: string, filter: FilterData[]): Promise<any> {
    let values: any = { columns: [], data: [], filter: [] };

    let query: string = `SELECT * FROM ${this.options.database}.${table} WHERE `;
    for (let d of filter) {
      if (values.columns.includes(d.column))
        throw new Error(`Column '${d.column}' specified twice.`)

      values.columns.push(d.column);
      values.data.push(d.data);
      values.filter.push(d.filter_type ?? "AND");
    }

    let index: number = 0;
    for (let v of values.columns) {
      query += `${v} = ? ${index === values.columns.length - 1 ? "" : values.filter[index]} `;
      index++;
    }

    let connection: mysql.PoolConnection = await (await this.db).getConnection();

    // format the query
    query = connection.format(query, values.data);
    
    let result: any = connection.query(query);
    connection.release();

    return result;
  }

  async delete(table: string, filter: FilterData[]): Promise<any> {
    let values: any = { columns: [], data: [], filter: [] };

    let query: string = `DELETE FROM ${this.options.database}.${table} WHERE `;
    for (let d of filter) {
      if (values.columns.includes(d.column))
        throw new Error(`Column '${d.column}' specified twice.`)

      values.columns.push(d.column);
      values.data.push(d.data);
      values.filter.push(d.filter_type ?? "AND");
    }

    let index: number = 0;
    for (let v of values.columns) {
      query += `${v} = ? ${index === values.columns.length - 1 ? "" : values.filter[index]} `;
      index++;
    }

    let connection: mysql.PoolConnection = await (await this.db).getConnection();

    // format the query
    query = connection.format(query, values.data);
    
    let result: any = connection.query(query);
    connection.release();

    return result;
  }

  async update(table: string, data: InsertData[], filter: FilterData[]): Promise<any> {
    let values: any = { columns: [], data: [], filter: [], r_columns: [], r_data: [] };

    let query: string = `UPDATE ${this.options.database}.${table} SET `;
    for (let d of filter) {
      if (values.columns.includes(d.column))
        throw new Error(`Column '${d.column}' specified twice.`)

      values.columns.push(d.column);
      values.data.push(d.data);
      values.filter.push(d.filter_type ?? "AND");
    }

    for (let d of data) {
      values.r_columns.push(d.column);
      values.r_data.push(d.data);
    }

    let index: number = 0;
    for (let v of values.r_columns) {
      query += `${v} = ?${index === values.r_columns.length - 1 ? "" : ","} `;
      index++;
    }

    query += 'WHERE ';

    index = 0;

    for (let v of values.columns) {
      query += `${v} = ? ${index === values.columns.length - 1 ? "" : values.filter[index]} `;
      index++;
    }

    let connection: mysql.PoolConnection = await (await this.db).getConnection();

    // format the query
    query = connection.format(query, values.r_data.concat(values.data));
    
    let result: any = connection.query(query);
    connection.release();

    return result;
  }
};

export { Mysql, version };