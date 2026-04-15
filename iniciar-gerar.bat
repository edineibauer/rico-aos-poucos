@echo off
title Gerador de Paginas FII - Rico aos Poucos
echo.
echo ===================================================
echo   Iniciando gerador de paginas FII (Opus 4.6)...
echo ===================================================
echo.
wsl.exe -d Ubuntu-24.04 bash -lc "cd /home/nenabauer/projetos/rico-aos-poucos/scripts/fundosnet && ./start_gerar.sh"
echo.
echo ===================================================
echo   Pressione qualquer tecla para fechar esta janela.
echo   O gerador continua rodando em segundo plano.
echo ===================================================
pause > nul
