import express, {Request, Response } from "express";

const app = express();

app.use(express.json());

app.get("/task", (request: Request, response: Response) => {
    return response.status(200).json({
        tasks:[{ id: 1, name: "Fazer trabalho", done: false}]
    });
});

export default app;