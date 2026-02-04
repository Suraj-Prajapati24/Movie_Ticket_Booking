import client from "../dbConnection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({
            message: "requires all fields",
        });
    }
    const alreadyExsisting = await client.query(
        `SELECT * FROM users WHERE email = '${email}'`
    );
    if (alreadyExsisting.rowCount) {
        return res.status(409).json({
            message: "Email  already registered",
        });
    }
    const hashedPass = await bcrypt.hash(password, 10);
    const createUser = await client.query(
        `INSERT INTO users (username, email, password_hash, role) 
      VALUES ('${username}', '${email}', '${hashedPass}', 'client') 
      RETURNING user_id, username, email, role`
    );
    return res.status(200).json({
      message: "Uses Registerd Successfully",
      user: createUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
        error: `${error}`, 
        message: "SERVER ERROR" 
    });
  }
};

export const loginUser = async (req, res) => {
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "requires all fields",
            });
        }
        const userDetails = await client.query(
            `SELECT user_id, username, email, password_hash, role FROM users WHERE email = '${email}'`
        );
        if(userDetails.rowCount === 0){
            return res.status(400).json({
                message:"Email doesn't exsists"
            })
        }
        const isMatch = await bcrypt.compare(password, userDetails.rows[0].password_hash);
        if(!isMatch){
            return res.status(400).json({
                message:"Email and Password doesn't match"
            })
        }
        const token = jwt.sign(
            {
                user_id: userDetails.rows[0].user_id,
                role: userDetails.rows[0].role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "User LoggedIn Successfully",
            token,
            user: {
                "user_id": userDetails.rows[0].user_id,
                "username": userDetails.rows[0].username,
                "email": userDetails.rows[0].email,
                "role": userDetails.rows[0].role
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: `${error}`, 
            message: "SERVER ERROR" 
        });
    }
};
