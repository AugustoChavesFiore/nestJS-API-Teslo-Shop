import {v4 as UUID} from 'uuid'

export const fileNamer = (req:Express.Request, file: Express.Multer.File, callback:Function)=>{
    if(!file) return callback(new Error('No file empty'), false);
    const fileExptension = file.mimetype.split('/')[1];
    
    const fileName= `${UUID()}.${fileExptension}`;

    return callback(null, fileName)

};  