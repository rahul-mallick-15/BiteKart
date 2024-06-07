import asyncWrapper from "../middleware/async"
import sequelize from "../models"
import Contact from "../models/Contact"
import {Op} from "sequelize"

export const getAllContacts = asyncWrapper(async (req: any, res: any, next: any) => {
    const [results, metadata] = await sequelize.query('SELECT * FROM "Contact"');
    // console.log(results);
    return res.status(200).json({ success: true, data: results })
})

export const createContact = asyncWrapper(async (req: any, res: any, next: any) => {
    const { email, phoneNumber } = req.body;

    // orders on FluxKart.com will always have either an email or phoneNumber
    if(!email && !phoneNumber){
        return res.status(400).json({ success: false, msg: "Please provide email or phone number" })
    }
    let [results, metadata] = await sequelize.query('SELECT id, "linkedId", "linkPrecedence" FROM "Contact" WHERE ("email" = ? or "phoneNumber" = ?) order by "linkPrecedence"', {replacements: [email, phoneNumber]});
    let createdContact;
    if(results.length == 0){
        createdContact = await Contact.create({
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: "primary"
        });
    }
    else{
        const {id, linkedId, linkPrecedence} = results[0] as {id:number,linkedId:number,linkPrecedence:string}
        createdContact = await Contact.create({
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: "secondary",
            linkedId: (linkPrecedence == 'primary' ? id : linkedId)
        });
    }
    // console.log(results);
    return res.status(201).json({ success: true, createdContact })
})

export const identifyContact = asyncWrapper(async (req: any, res: any, next: any) => {
    const { email, phoneNumber } = req.body;
    console.log(email,phoneNumber);
    
    let [results, metadata] = await sequelize.query('SELECT id, email, "phoneNumber", "linkPrecedence", "linkedId" FROM "Contact" WHERE email = ? or "phoneNumber" = ? order by "linkPrecedence", "createdAt" desc', { replacements: [email, phoneNumber] });
    if(results.length == 0){
        return createContact(req,res,next);
    }
    
    if(email && phoneNumber){
        // Determine if email or phone number exists
        const emailExists = results.some((contact: any) => contact.email === email);
        const phoneNumberExists = results.some((contact: any) => contact.phoneNumber === phoneNumber);

        if(!emailExists || !phoneNumberExists){
            return createContact(req, res, next);
        }

        let ids = new Set<number>();
        for(let i = 0; i < results.length; i++){
            const {id, linkedId, linkPrecedence} = results[i] as {id:number,linkedId:number,linkPrecedence:string};
            ids.add(linkPrecedence == "primary" ? id : linkedId);
        }

        if (ids.size > 1) {
            [results, metadata] = await sequelize.query(
              `SELECT id FROM "Contact" WHERE id IN (:ids) ORDER BY "createdAt" desc`,
              {
                replacements: { ids: Array.from(ids) },
              }
            );
            const id = (results[0] as {id:number}).id ;
            await Contact.update(
                {
                  linkPrecedence: 'secondary',
                  updatedAt: new Date(), // Set updatedAt to the current timestamp
                  linkedId: (results[1] as {id:number}).id
                },
                {
                  where: { [Op.or]:[{id: id}, {linkedId: id}] },
                }
              );

            [results, metadata] = await sequelize.query('SELECT id, email, "phoneNumber", "linkPrecedence", "linkedId" FROM "Contact" WHERE email = ? or "phoneNumber" = ? order by "linkPrecedence"', { replacements: [email, phoneNumber] });
        }   
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
    // console.log(results);
    res.status(200).json({ contact: {primaryContactId,emails,phoneNumbers,secondaryContactIds}})
})
