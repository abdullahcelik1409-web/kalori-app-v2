import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const generateWeeklyReport = async (weeklyData, aiSummary, userProfile) => {
    const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background-color: #f8fafc; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .logo { color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .title { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
          .date { color: #64748b; font-size: 14px; }
          
          .section { background: white; padding: 25px; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .section-title { color: #3b82f6; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 10px; }
          .stat-card { background: #f1f5f9; padding: 15px; border-radius: 10px; text-align: center; }
          .stat-value { font-size: 20px; font-weight: bold; color: #0f172a; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .low { color: #f59e0b; }
          .good { color: #10b981; }
          
          .ai-summary { line-height: 1.6; color: #334155; white-space: pre-line; }
          .footer { text-align: center; margin-top: 50px; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Rebalance</div>
          <div class="title">HaftalÄ±k Denge Raporu</div>
          <div class="date">${new Date().toLocaleDateString('tr-TR')} tarihinde hazÄ±rlandÄ±</div>
        </div>

        <div class="section">
          <div class="section-title">KullanÄ±cÄ± Ã–zeti</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${userProfile.full_name || 'Abdul'}</div>
              <div class="stat-label">KullanÄ±cÄ±</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${userProfile.target_calories} kcal</div>
              <div class="stat-label">GÃ¼nlÃ¼k Hedef</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">HaftalÄ±k Veriler</div>
          <table>
            <thead>
              <tr>
                <th>GÃœN</th>
                <th>KALORÄ°</th>
                <th>SU (ML)</th>
                <th>DURUM</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyData.map(d => `
                <tr>
                  <td><b>${d.label}</b></td>
                  <td>${d.calories} kcal</td>
                  <td>${d.water} ml</td>
                  <td class="${d.calories > userProfile.target_calories ? 'low' : 'good'}">
                    ${d.calories > userProfile.target_calories ? 'Hefed ÃœstÃ¼' : 'Dengeli'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">AI KoÃ§ Analizi</div>
          <div class="ai-summary">
            ${aiSummary.replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="footer">
          Bu rapor 'Rebalance' AI tarafÄ±ndan otomatik olarak oluÅŸturulmuÅŸtur.<br/>
          SaÄŸlÄ±klÄ± bir yaÅŸam iÃ§in dengeli beslenmeye devam et!
        </div>
      </body>
    </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        console.log('PDF generated at:', uri);

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } else {
            // Web iÃ§in indirme simÃ¼lasyonu veya Alert
            alert('PDF Raporunuz hazÄ±rlandÄ±. Mobil cihazda paylaÅŸabilirsiniz.');
        }
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
};
