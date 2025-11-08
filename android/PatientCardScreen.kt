package com.genidocmobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun PatientCardScreen(genidocId: String, onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Carte GeniDoc", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(24.dp))
        Text("Votre ID :", style = MaterialTheme.typography.bodyLarge)
        Text(genidocId, style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(32.dp))
        Button(onClick = { onLogout() }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) {
            Text("Déconnexion", color = MaterialTheme.colorScheme.onPrimary)
        }
    }
}
