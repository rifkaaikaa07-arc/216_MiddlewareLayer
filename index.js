import "dotenv/config";
import express from 'express';
import pg from "pg";
import joi from "joi";

const app = express()
const port = process.env.port
const {Pool} = pg

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

app.use(express.json())
app.use(express.urlencoded({ extended: true}))

// middleware logging
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start
        console.log({
            method: req.method,
            url: req.originalUrl,
            statusCode: req.statusCode,
            duration: `${duration}ms`
        })
    })
    next()
})

//respone envelope
function succesResponse(res, message, data, status = 200){
    return res.status(status).json({
        success: true, message, data, error: null,
    })
}

function errorResponse(res, message, status, details = null){
    return res.status(status).json({
        success: false, message, data:null, error: details,
    })
}

//joi Validation Schema
const biodataSchema = joi.object({
    id: joi.number().integer().positive(),
    nama: joi.string().trim().min(2).max(100).required(),
    nim: joi.string().trim().min(5).max(20).required(),
    kelas: joi.string().trim().min(1).max(20).required(),
})

const idSchema = joi.object({
    id: joi.number().integer().positive().required(),
    
})

//middleware untuk Validation body
function validateBody(schema){
    return (req, res, next) =>{
        const {error, value} = schema.validate(req.body,{
            abortEarly: false, convert: true, allowUnknown: false
        })
        if(error){
            return errorResponse(
                res,
                "Validation Error",
                400, 
                error.details.map(item =>({
                    field: item.path.join('.'),
                    message: item.message,
                }))
            )
        }
        req.body = value
        next()
    }
}

//middleware untuk Validation params
function validateParams(schema){
    return (req, res, next) =>{
        const {error, value} = schema.validate(req.params);
        if(error){
            return errorResponse(
                res,
                'parameter tidak valid',
                400, 
                error.details.map(item =>({
                    field: item.path.join('.'),
                    message: item.message,
                }))
            )
        }
        req.params = value
        next()
    }
}

app.get('/', async(req, res) =>{
    const result = await pool.query('SELECT * FROM biodata ORDER BY id')
    return succesResponse(res, "Data berhasil diambil", result.rows)
})