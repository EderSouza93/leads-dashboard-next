// scripts/cronSyncLeads.ts (opcional, apenas para dev local)
import cron from 'node-cron';
import { syncCurrent, syncLeadsRange } from '@/services/leadSyncService';

const DAYS_TO_FETCH = 30;

console.log('Cron jobs locais configurados (apenas para desenvolvimento).');

// A cada 5 minutos (dia atual)
cron.schedule('*/5 * * * *', async () => {
  console.log('Iniciando sincronização do dia atual (local)...');
  await syncCurrent();
  console.log('Sincronização do dia atual concluída!');
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo',
});

// Diariamente às 00:00 (15 dias)
cron.schedule('0 0 * * *', async () => {
  console.log('Iniciando sincronização completa dos últimos 15 dias (local)...');
  await syncLeadsRange(DAYS_TO_FETCH);
  console.log('Sincronização completa concluída!');
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo',
});

// Executar ao iniciar
syncLeadsRange(DAYS_TO_FETCH).catch(console.error);