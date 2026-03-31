const bcrypt = require('bcryptjs')
require('dotenv').config()
require('reflect-metadata')

const { AppDataSource } = require('../config/dataSource')

function getArg(name, fallback = null) {
    const idx = process.argv.findIndex((a) => a === `--${name}`)
    if (idx === -1) return fallback
    const value = process.argv[idx + 1]
    return value ?? fallback
}

async function main() {
    const email = String(getArg('email', '')).trim().toLowerCase()
    const password = String(getArg('password', '')).trim()
    const name = String(getArg('name', 'System Admin')).trim()
    const deptName = String(getArg('dept', 'Administration')).trim()

    if (!email || !password) {
        console.log('Usage: node src/scripts/bootstrap-admin.js --email you@x.com --password pass123 --name "Admin" --dept "Administration"')
        process.exitCode = 2
        return
    }

    await AppDataSource.initialize()

    const userRepo = AppDataSource.getRepository('User')
    const deptRepo = AppDataSource.getRepository('Department')

    const existing = await userRepo.findOne({ where: { email } })
    if (existing) {
        console.log('User already exists:', email)
        return
    }

    let dept = await deptRepo.findOne({ where: { dept_name: deptName } })
    if (!dept) {
        dept = await deptRepo.save({
            dept_name: deptName,
            dept_head_name: null,
            contact_number: null,
            budget_allocation: null,
        })
        console.log('Created department:', dept.dept_name, `(id=${dept.dept_id})`)
    }

    const password_hash = await bcrypt.hash(password, 10)

    const created = await userRepo.save({
        user_name: name,
        email,
        role: 'Admin',
        password_hash,
        is_active: true,
        department: dept,
    })

    console.log('Created admin:', created.email, `(id=${created.user_id})`, `dept_id=${dept.dept_id}`)
}

main()
    .catch((err) => {
        console.error(err)
        process.exitCode = 1
    })
    .finally(async () => {
        try {
            if (AppDataSource.isInitialized) await AppDataSource.destroy()
        } catch { }
    })
