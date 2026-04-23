const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const applicationRoutes = require('./routes/application.routes');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'application-service' });
});

app.use('/api/v1/applications', applicationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Application Service listening on port ${PORT}`);
});
