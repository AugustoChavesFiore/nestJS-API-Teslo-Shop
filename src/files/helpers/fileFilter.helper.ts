import { error } from "console";


export const fileFilter = (req:Express.Request, file: Express.Multer.File, callback:Function)=>{
    if(!file) return callback(new Error('No file empty'), false);
    const fileExptension = file.mimetype.split('/')[1];
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif' ];
    if(validExtensions.includes(fileExptension)){
        return callback(null, true)
    };
    return callback(null, false)

};  