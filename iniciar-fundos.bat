@echo off
title Pipeline Fundos.NET - Rico aos Poucos
echo.
echo ===================================================
echo   Iniciando Pipeline Fundos.NET...
echo ===================================================
echo.
wsl.exe -d Ubuntu-24.04 bash -lc "cd /home/nenabauer/projetos/rico-aos-poucos/scripts/fundosnet && ./start.sh"
echo.
echo ===================================================
echo   Pressione qualquer tecla para fechar esta janela.
echo   O pipeline continua rodando em segundo plano.
echo ===================================================
pause > nul
