
-- Atualizar billing_due_day da agência demo
UPDATE agencies SET billing_due_day = 10 WHERE id = '4f2ab3ed-6d0f-4a78-a34d-45abe25b22c0';

-- Inserir dados de teste para boleto unificado
DO $$
DECLARE
  agency_id_val UUID := '4f2ab3ed-6d0f-4a78-a34d-45abe25b22c0';
  a1 UUID := gen_random_uuid(); a2 UUID := gen_random_uuid(); a3 UUID := gen_random_uuid();
  a4 UUID := gen_random_uuid(); a5 UUID := gen_random_uuid(); a6 UUID := gen_random_uuid();
  a7 UUID := gen_random_uuid(); a8 UUID := gen_random_uuid(); a9 UUID := gen_random_uuid();
  a10 UUID := gen_random_uuid(); a11 UUID := gen_random_uuid(); a12 UUID := gen_random_uuid();
  c1 UUID := gen_random_uuid(); c2 UUID := gen_random_uuid(); c3 UUID := gen_random_uuid();
  c4 UUID := gen_random_uuid(); c5 UUID := gen_random_uuid(); c6 UUID := gen_random_uuid();
  c7 UUID := gen_random_uuid(); c8 UUID := gen_random_uuid(); c9 UUID := gen_random_uuid();
  c10 UUID := gen_random_uuid(); c11 UUID := gen_random_uuid(); c12 UUID := gen_random_uuid();
  ref_month INT;
  ref_year INT;
  inst_num INT;
BEGIN
  INSERT INTO analyses (id, agency_id, inquilino_nome, inquilino_cpf, valor_aluguel, valor_condominio, valor_iptu,
    plano_garantia, taxa_garantia_percentual, garantia_anual, forma_pagamento_preferida, status,
    imovel_endereco, imovel_numero, imovel_cidade, imovel_estado, setup_fee, created_at, updated_at, approved_at)
  VALUES
    (a1, agency_id_val, 'Renato Barros', '11122233301', 2000, 400, 150, 'prime', 12, 3672, 'boleto_imobiliaria', 'ativo', 'Rua das Acacias', '100', 'Sao Paulo', 'SP', 0, now(), now(), '2025-12-01'),
    (a2, agency_id_val, 'Sandra Vieira', '11122233302', 3000, 600, 250, 'prime', 12, 5544, 'boleto_imobiliaria', 'ativo', 'Av. Brasil', '200', 'Sao Paulo', 'SP', 0, now(), now(), '2025-12-01'),
    (a3, agency_id_val, 'Tiago Melo', '11122233303', 1500, 350, 100, 'start', 15, 3510, 'boleto_imobiliaria', 'ativo', 'Rua dos Pinheiros', '300', 'Sao Paulo', 'SP', 0, now(), now(), '2025-12-01'),
    (a4, agency_id_val, 'Vanessa Cruz', '11122233304', 4500, 900, 400, 'exclusive', 10, 6960, 'boleto_imobiliaria', 'ativo', 'Rua Augusta', '400', 'Sao Paulo', 'SP', 0, now(), now(), '2026-01-01'),
    (a5, agency_id_val, 'Wagner Santos', '11122233305', 2200, 500, 180, 'prime', 12, 4147.20, 'boleto_imobiliaria', 'ativo', 'Rua Oscar Freire', '500', 'Sao Paulo', 'SP', 0, now(), now(), '2026-01-01'),
    (a6, agency_id_val, 'Ximena Lopes', '11122233306', 5000, 1000, 350, 'exclusive', 10, 7620, 'boleto_imobiliaria', 'ativo', 'Av. Paulista', '600', 'Sao Paulo', 'SP', 0, now(), now(), '2026-01-01'),
    (a7, agency_id_val, 'Yuri Campos', '11122233307', 1800, 400, 120, 'start', 15, 4176, 'boleto_imobiliaria', 'ativo', 'Rua Consolacao', '700', 'Sao Paulo', 'SP', 0, now(), now(), '2026-01-01'),
    (a8, agency_id_val, 'Zilda Ferraz', '11122233308', 3500, 700, 280, 'prime', 12, 6451.20, 'boleto_imobiliaria', 'ativo', 'Rua Haddock Lobo', '800', 'Sao Paulo', 'SP', 0, now(), now(), '2026-02-01'),
    (a9, agency_id_val, 'Andre Moura', '11122233309', 2800, 550, 200, 'prime', 12, 5112, 'boleto_imobiliaria', 'ativo', 'Rua da Consolacao', '900', 'Sao Paulo', 'SP', 0, now(), now(), '2026-02-01'),
    (a10, agency_id_val, 'Beatriz Novaes', '11122233310', 6000, 1200, 500, 'exclusive', 10, 9240, 'boleto_imobiliaria', 'ativo', 'Av. Reboucas', '1000', 'Sao Paulo', 'SP', 0, now(), now(), '2026-02-01'),
    (a11, agency_id_val, 'Caio Duarte', '11122233311', 1600, 350, 90, 'start', 15, 3672, 'boleto_imobiliaria', 'ativo', 'Rua Bela Cintra', '1100', 'Sao Paulo', 'SP', 0, now(), now(), '2026-03-01'),
    (a12, agency_id_val, 'Diana Prado', '11122233312', 4000, 800, 350, 'prime', 12, 7416, 'boleto_imobiliaria', 'ativo', 'Rua Pamplona', '1200', 'Sao Paulo', 'SP', 0, now(), now(), '2026-03-01');

  INSERT INTO contracts (id, agency_id, analysis_id, status, payment_method, activated_at, data_fim_contrato, created_at, updated_at)
  VALUES
    (c1, agency_id_val, a1, 'ativo', 'boleto_imobiliaria', '2025-12-01', '2026-12-01', now(), now()),
    (c2, agency_id_val, a2, 'ativo', 'boleto_imobiliaria', '2025-12-01', '2026-12-01', now(), now()),
    (c3, agency_id_val, a3, 'ativo', 'boleto_imobiliaria', '2025-12-01', '2026-12-01', now(), now()),
    (c4, agency_id_val, a4, 'ativo', 'boleto_imobiliaria', '2026-01-01', '2027-01-01', now(), now()),
    (c5, agency_id_val, a5, 'ativo', 'boleto_imobiliaria', '2026-01-01', '2027-01-01', now(), now()),
    (c6, agency_id_val, a6, 'ativo', 'boleto_imobiliaria', '2026-01-01', '2027-01-01', now(), now()),
    (c7, agency_id_val, a7, 'ativo', 'boleto_imobiliaria', '2026-01-01', '2027-01-01', now(), now()),
    (c8, agency_id_val, a8, 'ativo', 'boleto_imobiliaria', '2026-02-01', '2027-02-01', now(), now()),
    (c9, agency_id_val, a9, 'ativo', 'boleto_imobiliaria', '2026-02-01', '2027-02-01', now(), now()),
    (c10, agency_id_val, a10, 'ativo', 'boleto_imobiliaria', '2026-02-01', '2027-02-01', now(), now()),
    (c11, agency_id_val, a11, 'ativo', 'boleto_imobiliaria', '2026-03-01', '2027-03-01', now(), now()),
    (c12, agency_id_val, a12, 'ativo', 'boleto_imobiliaria', '2026-03-01', '2027-03-01', now(), now());

  -- Contract 1: Jan-Dec/2026, 306
  FOR inst_num IN 1..12 LOOP
    ref_month := ((0 + inst_num - 1) % 12) + 1;
    ref_year := 2026;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c1, inst_num, ref_month, ref_year, 306, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 2: Jan-Dec/2026, 462
  FOR inst_num IN 1..12 LOOP
    ref_month := ((0 + inst_num - 1) % 12) + 1;
    ref_year := 2026;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c2, inst_num, ref_month, ref_year, 462, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 3: Jan-Dec/2026, 292.50
  FOR inst_num IN 1..12 LOOP
    ref_month := ((0 + inst_num - 1) % 12) + 1;
    ref_year := 2026;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c3, inst_num, ref_month, ref_year, 292.50, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 4: Jan-Dec/2026, 580
  FOR inst_num IN 1..12 LOOP
    ref_month := ((0 + inst_num - 1) % 12) + 1;
    ref_year := 2026;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c4, inst_num, ref_month, ref_year, 580, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 5: Feb/2026-Jan/2027, 345.60
  FOR inst_num IN 1..12 LOOP
    ref_month := ((1 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (1 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c5, inst_num, ref_month, ref_year, 345.60, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 6: Feb/2026-Jan/2027, 635
  FOR inst_num IN 1..12 LOOP
    ref_month := ((1 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (1 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c6, inst_num, ref_month, ref_year, 635, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 7: Feb/2026-Jan/2027, 348
  FOR inst_num IN 1..12 LOOP
    ref_month := ((1 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (1 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c7, inst_num, ref_month, ref_year, 348, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 8: Feb/2026-Jan/2027, 537.60
  FOR inst_num IN 1..12 LOOP
    ref_month := ((1 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (1 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c8, inst_num, ref_month, ref_year, 537.60, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 9: Mar/2026-Feb/2027, 426
  FOR inst_num IN 1..12 LOOP
    ref_month := ((2 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (2 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c9, inst_num, ref_month, ref_year, 426, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 10: Mar/2026-Feb/2027, 770
  FOR inst_num IN 1..12 LOOP
    ref_month := ((2 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (2 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c10, inst_num, ref_month, ref_year, 770, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 11: Mar/2026-Feb/2027, 306
  FOR inst_num IN 1..12 LOOP
    ref_month := ((2 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (2 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c11, inst_num, ref_month, ref_year, 306, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;

  -- Contract 12: Apr/2026-Mar/2027, 618
  FOR inst_num IN 1..12 LOOP
    ref_month := ((3 + inst_num - 1) % 12) + 1;
    ref_year := 2026 + CASE WHEN (3 + inst_num - 1) >= 12 THEN 1 ELSE 0 END;
    INSERT INTO guarantee_installments (agency_id, contract_id, installment_number, reference_month, reference_year, value, status, due_date)
    VALUES (agency_id_val, c12, inst_num, ref_month, ref_year, 618, 'pendente', make_date(ref_year, ref_month, 10));
  END LOOP;
END $$;
