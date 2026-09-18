import express from "express";

declare global {
  namespace Express {
    interface Request {
      userId? :string
    }
  }
}

// we globally declare that the type of the "Request" includes a field name user? : string 