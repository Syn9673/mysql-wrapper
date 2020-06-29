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
  type?: string
}

interface InsertData {
  column: string,
  data: any
}

interface FilterData extends InsertData {
  filter_type?: string
}

//what the fuck is a bluebird
class Mysql {
  public db: Bluebird<mysql.Connection>;
  constructor(public options: Options = {}) {
    this.db = mysql.createConnection(options);
  }

  async create_table(table_name: string, table_data: ColumnData[]): Promise<any> {
    let statement = `CREATE TABLE IF NOT EXISTS ${this.options.database}.${table_name}`;
    for (let i = 0; i < table_data.length; i++) {
      if (i === table_data.length - 1) {
        statement += ` ${table_data[i].name} ${table_data[i].type ?? "varchar(120)"})`;
      } else if (i === 0) {
        statement += ` (${table_data[i].name} ${table_data[i].type ?? "varchar(120)"},`;
      } else {
        statement += ` ${table_data[i].name} ${table_data[i].type ?? "varchar(120)"},`;
      };
    }

    (await this.db).query(statement);
  }

  async insert(table: string, data: InsertData[]): Promise<any> {
    let values: any = { columns: [], data: [] };

    let query: string = `INSERT INTO ${this.options.database}.${table}`;
    for (let d of data) {
      if (values.columns.includes(d.column))
        throw new Error(`Column '${d.column}' specified twice.`)

      values.columns.push(d.column);
      values.data.push(d.data);
    }

    query += ` (${values.columns.map((c: any) => c).join(', ')})`;

    // add escaped values
    query += ` VALUES (${values.data.map(() => '?').join(', ')})`;

    // format the query
    query = (await this.db).format(query, values.data);

    return (await this.db).query(query);
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

    query = (await this.db).format(query, values.data);
    
    return (await this.db).query(query);
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

    query = (await this.db).format(query, values.data);
    
    return (await this.db).query(query);
  }
};

export { Mysql, version };