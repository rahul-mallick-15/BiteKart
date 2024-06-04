const express = require("express");
const router = express.Router();
import { createContact, getAllContacts, identifyContact } from "../controllers/contacts";

router.route("/identify").post(identifyContact);
router.route("/").get(getAllContacts).post(createContact);

export default router;
