// Dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const AppError = require('./util/appError');
const globalErrorHandler = require('./controllers/errorController');

// Application Routes
const projectRouter = require('./routes/projectRoutes');
const adminRouter = require('./routes/adminRoute');
const objectiveRouter = require('./routes/objectiveRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors());
app.use(express.json());

// Mount the CMS Routes
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/objective', objectiveRouter);
app.use('/api/v1/user', userRouter);

// Handle unhandled routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
