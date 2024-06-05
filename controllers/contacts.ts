import asyncWrapper from "../middleware/async"
import sequelize from "../models"
import Contact from "../models/Contact"

export const getAllContacts = asyncWrapper(async (req: any, res: any, next: any) => {
    const [results, metadata] = await sequelize.query('SELECT * FROM "Contact"');
    console.log(results);
    // console.log(metadata);
    res.status(200).json({ success: true, data: results })
})

export const createContact = asyncWrapper(async (req: any, res: any, next: any) => {
    const { email, phoneNumber } = req.body;
    let [results, metadata] = await sequelize.query('SELECT id, "linkPrecedence" FROM "Contact" WHERE ("email" = ? or "phoneNumber" = ?) and "linkPrecedence"=\'primary\'', {replacements: [email, phoneNumber]});
    let createdContact;
    if(results.length == 0){
        createdContact = await Contact.create({
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: "primary"
        });
    }
    else{
        const [{id}] = results as {id:number}[];
        createdContact = await Contact.create({
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: "secondary",
            linkedId: id
        });
    }
    console.log(results);
    res.status(201).json({ success: true, createdContact })
})

export const identifyContact = asyncWrapper(async (req: any, res: any, next: any) => {
    const { email, phoneNumber } = req.body;
    console.log(email,phoneNumber);
    
    let [results, metadata] = await sequelize.query('SELECT id, email, "phoneNumber", "linkPrecedence", "linkedId" FROM "Contact" WHERE email = ? or "phoneNumber" = ? order by "linkPrecedence"', { replacements: [email, phoneNumber] });
    if(results.length == 0){
        createContact(req,res,next);
        return
    }
    const {linkPrecedence} = results[0] as {linkPrecedence:string}
    if(linkPrecedence == "secondary"){
        const {id, linkedId} = results[0] as {id:number, linkedId:number};
        [results, metadata] = await sequelize.query('SELECT id, email, "phoneNumber" FROM "Contact" WHERE id = ? or "linkedId" = ? order by "linkPrecedence"',{ replacements: [linkedId, linkedId]});
    }
    else{
        const {id, linkedId} = results[0] as {id:number, linkedId:number};
        [results, metadata] = await sequelize.query('SELECT id, email, "phoneNumber" FROM "Contact" WHERE id = ? or "linkedId" = ? order by "linkPrecedence"',{ replacements: [id, id]});
    }

    const {id:primaryContactId} = results[0] as {id:number};
    const emails: string[] = Array.from(new Set((results as { email: string }[]).map((item) => item.email)));
    const phoneNumbers: string[] = Array.from(new Set((results as { phoneNumber: string }[]).map((item) => item.phoneNumber)));
    const secondaryContactIds = (results as { id: number }[]).slice(1).map(obj => obj.id);
    console.log(results);
    res.status(200).json({ contact: {primaryContactId,emails,phoneNumber,secondaryContactIds}})
})
