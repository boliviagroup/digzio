const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const institutionRoutes = require('./routes/institution.routes');

const app = express();
const PORT = process.env.PORT || 3008;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'institution-api' });
});

app.use('/api/v1/institutions', institutionRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Institution API listening on port ${PORT}`);
});
