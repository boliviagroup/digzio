const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const leaseRoutes = require('./routes/lease.routes');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'lease-service' });
});

app.use('/api/v1/leases', leaseRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Lease Service listening on port ${PORT}`);
});
