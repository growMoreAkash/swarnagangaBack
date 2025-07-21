import express from "express";
import cors from 'cors'
import morgan from 'morgan'
import connect from "./connect.js";
import 'dotenv/config'

import userRouter from "./router/user.router.js";
import { catagoryRouter } from "./router/catagory.router.js";
import { productRouter } from "./router/product.router.js";
import { adminRouter } from "./router/admin.router.js";
import { selectionRouter } from "./router/selection.router.js";
import { goldRouter } from "./router/gold.router.js";

const app = express();

app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))
app.disable('x-powered-by')


app.use("/api", userRouter)
app.use("/api", catagoryRouter)
app.use("/api", productRouter)
app.use("/api", adminRouter)
app.use("/api", selectionRouter)
app.use("/api", goldRouter)

connect().then(() => {
    app.get('/', (req, res) => {
        res.status(200).json("Server started at port " + process.env.PORT);
    })
    app.listen(process.env.PORT, () => {
        console.log("Server started at port " + process.env.PORT);
    });
}).catch(e => console.log(e));