import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // <--- Importante para *ngIf
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiClientService } from '../../core/services/api-client.service';

interface LoginResponse {
  token?: string;
  error?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm: ReturnType<FormBuilder['group']>;
  errorMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder, private api: ApiClientService) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { correo, contrasenia } = this.loginForm.value;

    console.log('Enviando login con:', { correo, contrasenia });

    // Dispara request
    this.api.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasenia })
    });

    // Observa resultado
    setTimeout(() => {
      const val = this.api.value(); // 👈 llamar signal
      console.log('Respuesta de API:', val);

      if (val?.error) {
        this.errorMessage.set(val.error);
      } else if (val?.token) {
        this.errorMessage.set(null);
        console.log('Login exitoso, token:', val.token);
      }
    }, 500);
  }

  get status() {
    return this.api.value;
  }
}
