import HttpError from "../models/https-error.js";
import { geoLocation } from "../utils/geo.location.js";
import { validationResult } from "express-validator";
import { Place } from "../models/place.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";


const getPlaceById = async(req,res,next)=>{
    const pLaceId = req.params.pid

    let place;


    try {

         place =  await Place.findById(pLaceId)

    } catch (error) {
        
        const Error =  new HttpError("something went wrong", 500);
        return next(Error);
    }

    
    
    if(!place){
       const Error =  new HttpError("provided if doesnt exist",404);

       return next (Error);
    }
    else{
 
    res.json({place : place.toObject({getters:true})});
    }
}

 const getPlacesByUserId = async(req,res,next)=>{
    const userId  = req.params.uid

     let user 

     try {
        user = await Place.find({creator:userId});
     } catch (error) {
        const Error = new HttpError("something went wrong",500);
        return next(Error);
     }
     


      if(!user){
        throw new HttpError("user can not be found", 404);
          }
    res.json({user: user.map(u=>u.toObject({getters:true}))})
}

 const createPlace = async(req,res,next)=>{
   const errors = validationResult(req);

   if(!errors.isEmpty()){
    console.log(errors);
      return next (new HttpError("please enter all fields carefully", 422));

   }

    const {title , description , address  , creator} = req.body

    let coordinates;


try {
    coordinates =  geoLocation(address);

} catch (error) {

    console.error(error.message);

    const Error = new HttpError("location can not be fetched",400);

    return next(Error);
    
}

       


    const createdPlace = new Place({
        title,
        address,
        description,
        location : coordinates,
        image: "https://picsum.photos/200",
        creator,
        
    })


    let user;

    try {
        user = await User.findById(creator);
    } catch (error) {
        console.error(error.message);

        const Error = new HttpError("imput user with user id not found",401);

        return next(Error);
    }


    if(!user){
        const Error = new HttpError("user can not be found",500);
        return next(Error);
    }
    


    try {
      const sess = mongoose.startSession();
      sess.startTransaction()
      await createdPlace.save({session : sess});
      User.places.push(createdPlace);
      await User.save({session:sess});
      (await sess).commitTransaction();
      

    } catch (error) {
        const Error = new HttpError("creation failed please try again",500);
        return next(Error);
    }

    res.status(201).json({place : createdPlace});


}

 const updatePlaceById = async (req,res,next)=>{
    const placeId = req.params.pid;

    const errors = validationResult(req);

    if(!errors.isEmpty()){
     console.log(errors);
     throw new HttpError("please enter all fields carefully", 422);
    }
    
    const { title , description} = req.body

let place;

try {
    place = await Place.findById(placeId)
} catch (error) {
    console.error(error.message);

    const Error = new HttpError("could not procced try again",400);

    return next(Error);
}

place.title = title,
place.description = description;

try {
    await place.save();
} catch (error) {
    console.error(error.message);
    const Error = new HttpError("place could not be updated",500);

    return next(Error);
}


    res.status(200).json({place:place.toObject({getters:true})});


    }

     const deletePlace = async (req,res,next)=>{
        const placeId = req.params.pid;

       let place;
       
       try {
        place = await Place.findById(placeId).populate("creator");
       } catch (error) {
        console.error(error.message);

        const Error = new HttpError("Something went wrong ",500);

        return next(Error);
       }


       if(!place){
        const Error = new HttpError("place does not exist",404);
        return next(Error);
       }



       try {
        // 

        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session:sess});
        place.creator.places.pull(place);
        await place.creator.save({session:sess});
        await sess.commitTransaction();




       } catch (error) {

        console.error(error.message);
        const Error = new HttpError("something went wrong ",500);
        return next(Error);
       }



         

        res.status(200).json({message:"deletion sucessfull"});
    }



 export {getPlaceById,getPlacesByUserId,createPlace , updatePlaceById, deletePlace , };

