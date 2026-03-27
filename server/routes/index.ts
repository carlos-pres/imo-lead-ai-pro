import { Router } from "express";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";

const router = Router();

router.use("/health", healthRouter);
router.use("/leads", leadsRouter);

export { router };
