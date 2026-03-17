import { db } from "./db/index.js"

export async function createLead(data: any) {

  const result = await db.execute(
    `INSERT INTO leads (name, price, area, location)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [
      data.name,
      data.price,
      data.area,
      data.location
    ]
  )

  return result[0]
}

export async function getLeads() {

  return db.execute(
    `SELECT * FROM leads`
  )
}