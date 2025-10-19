"""
Run script for Finance Optimizer Service
"""

import os
from app import app, logger

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5004))
    logger.info(f"Starting Finance Optimizer Service on port {port}")
    logger.info("Press CTRL+C to stop the service")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('DEBUG', 'True').lower() == 'true'
    )

