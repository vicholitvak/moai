// d:\Moai\app\src\app.js (or your main server file)

const cooksRouter = require('./routers/cooks'); // Make sure the path is correct
const authRouter = require('./routers/auth');
const dishesRouter = require('./routers/dishes'); // 1. Import the new dishes router

// ... other app setup (express, cors, etc.)

// This middleware is crucial for your login route to read the email/password
// from the request body. Make sure it's present.
app.use(express.json());

app.use('/api/cooks', cooksRouter); // This line tells Express to use your router for any path starting with /api/cooks
app.use('/api/auth', authRouter);
app.use('/api/dishes', dishesRouter); // 2. Use the dishes router for any path starting with /api/dishes

// ... app.listen(...)
