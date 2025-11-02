window.formatUsageData = function(data) {
  const usagePercent = Math.round((data.generated_tokens / data.token_limit) * 100);
  const usageColor = usagePercent > 80 ? 'text-red-600' : usagePercent > 50 ? 'text-yellow-600' : 'text-green-600';
  
  return `
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="font-medium">Plan:</span>
        <span>${data.plan}</span>
      </div>
      
      <div class="flex justify-between items-center">
        <span class="font-medium">Usage:</span>
        <div class="flex items-center space-x-2">
          <span class="${usageColor} font-medium">${usagePercent}%</span>
          <span>(${formatNumber(data.generated_tokens)} / ${formatNumber(data.token_limit)} tokens)</span>
        </div>
      </div>
      
      <div class="flex justify-between items-center">
        <span class="font-medium">Reset Status:</span>
        <span>${data.reset_available ? 'Available' : 'Not available'}</span>
      </div>
      
      ${data.reset_available ? `
        <div class="flex justify-between items-center">
          <span class="font-medium">Next Reset:</span>
          <span>${data.time_to_next_reset_human} (${new Date(data.reset_time).toLocaleString()})</span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="font-medium">Reset Amount:</span>
          <span>${formatNumber(data.reset_amount)} tokens</span>
        </div>
      ` : ''}
    </div>
  `;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

window.loadUsageForToken = async function(token, element) {
  try {
    const url = `https://api.bytarch.dpdns.org/v1/usage?bearerToken=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Usage request failed');
    const data = await res.json();
    element.innerHTML = formatUsageData(data);
  } catch (e) {
    console.error('Usage fetch failed', e);
    element.innerHTML = `
      <div class="text-red-600 p-3 bg-red-50 rounded border border-red-200">
        Failed to load usage data. Please check your API key.
      </div>
    `;
  }
}