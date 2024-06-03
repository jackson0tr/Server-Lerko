import mongoose from 'mongoose';
require('dotenv').config();

const dbUrl:string = process.env.DB_URL || '';

const connectedDb =async () => {
    try{
        await mongoose.connect(dbUrl).then((data:any)=>{
            console.log(`Database is connected... ${data.connection.host}`);
        });
    }catch(err:any){
        console.log(err.message);
        setTimeout(connectedDb, 5000);
    }
}

export default connectedDb;

