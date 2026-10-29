# Ajusta o projeto Android gerado pelo Capacitor: versao, assinatura, orientacao, fundo.
import os, re, sys
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'android')
vc = os.environ.get('VERSION_CODE', '1'); vn = os.environ.get('VERSION_NAME', '1.0')
g = os.path.join(base, 'app/build.gradle'); t = open(g).read()
t = re.sub(r'versionCode \d+', 'versionCode ' + vc, t); t = re.sub(r'versionName "[^"]*"', 'versionName "%s"' % vn, t)
if 'signingConfigs' not in t:
    t = t.replace('    buildTypes {', '''    signingConfigs {
        release {
            def ks = System.getenv("KEYSTORE_PATH")
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias System.getenv("KEY_ALIAS")
                keyPassword System.getenv("KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {''', 1)
    t = t.replace("            minifyEnabled false", "            signingConfig signingConfigs.release\n            minifyEnabled false", 1)
open(g, 'w').write(t)
m = os.path.join(base, 'app/src/main/AndroidManifest.xml'); x = open(m).read()
if 'screenOrientation' not in x:
    x = x.replace('android:launchMode="singleTask"', 'android:launchMode="singleTask"\n            android:screenOrientation="portrait"', 1)
open(m, 'w').write(x)

# tela de abertura escura (Android 12+ usa o fundo da tema; as versoes antigas usam o drawable splash)
st = os.path.join(base, 'app/src/main/res/values/styles.xml'); y = open(st).read()
if 'windowSplashScreenBackground' not in y:
    y = y.replace('<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">',
        '<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">\n        <item name="windowSplashScreenBackground">#0E1014</item>', 1)
    open(st, 'w').write(y)
print('projeto Android ajustado: versionCode', vc, 'versionName', vn)

# Trava o tamanho de fonte do WebView em 100%: o jogo controla o proprio tamanho de texto
# (sem isso o app multiplica pela fonte do sistema Android, ex. 145%, e o layout estoura)
ma = os.path.join(base, 'app/src/main/java/br/com/legendariobr/financegame/MainActivity.java')
if os.path.exists(ma):
    j = open(ma).read()
    if 'setTextZoom' not in j:
        j = '''package br.com.legendariobr.financegame;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        travarFonte();
    }

    @Override
    public void onResume() {
        super.onResume();
        travarFonte();
    }

    private void travarFonte() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setTextZoom(100);
        }
    }
}
'''
        open(ma, 'w').write(j)
        print('MainActivity: textZoom travado em 100')
else:
    print('AVISO: MainActivity.java nao encontrada')
